//! iOS 系统播放器不读取 `hg://` 自定义协议里的分片，封面却能显示。
//! 这里在模拟器和本机回环地址上提供同一套媒体处理，只接受本机连接。

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

use crate::media;

static PORT: std::sync::atomic::AtomicU16 = std::sync::atomic::AtomicU16::new(0);

pub fn origin() -> Option<String> {
    let port = PORT.load(std::sync::atomic::Ordering::Relaxed);
    (port > 0).then(|| format!("http://127.0.0.1:{port}"))
}

pub fn start() {
    if PORT.load(std::sync::atomic::Ordering::Relaxed) != 0 {
        return;
    }
    thread::spawn(|| {
        let listener = match TcpListener::bind("127.0.0.1:0") {
            Ok(listener) => listener,
            Err(_) => return,
        };
        let port = listener.local_addr().map(|addr| addr.port()).unwrap_or(0);
        if port == 0 {
            return;
        }
        PORT.store(port, std::sync::atomic::Ordering::Relaxed);
        for stream in listener.incoming().flatten() {
            thread::spawn(move || {
                let _ = handle(stream);
            });
        }
    });
}

fn handle(mut stream: TcpStream) -> std::io::Result<()> {
    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(8)));
    let _ = stream.set_nodelay(true);
    let mut buf = [0_u8; 8192];
    let n = stream.read(&mut buf)?;
    let head = String::from_utf8_lossy(&buf[..n]);
    let first = head.lines().next().unwrap_or("");
    let mut parts = first.split_whitespace();
    let method = parts.next().unwrap_or("");
    let target = parts.next().unwrap_or("/");
    if method != "GET" {
        return write_status(&mut stream, 405, b"method");
    }
    let (path, query) = target.split_once('?').unwrap_or((target, ""));
    if !matches!(path, "/img" | "/hls" | "/seg") {
        crate::logging::trace(&format!("media.http status=404 path={path}"));
        return write_status(&mut stream, 404, b"not found");
    }
    crate::logging::trace(&format!("media.http begin path={path}"));
    let origin = origin().unwrap_or_else(|| "http://127.0.0.1".into());
    let response = tauri::async_runtime::block_on(media::handle(path, query, &origin));
    let status = response.status().as_u16();
    let ctype = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/octet-stream");
    crate::logging::trace(&format!("media.http done path={path} status={status} bytes={}", response.body().len()));
    let body = response.body();
    let header = format!(
        "HTTP/1.1 {status} OK\r\nContent-Type: {ctype}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\nAccess-Control-Allow-Origin: *\r\n\r\n",
        body.len()
    );
    stream.write_all(header.as_bytes())?;
    stream.write_all(body)?;
    Ok(())
}

fn write_status(stream: &mut TcpStream, status: u16, body: &[u8]) -> std::io::Result<()> {
    let header = format!(
        "HTTP/1.1 {status} ERR\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    stream.write_all(header.as_bytes())?;
    stream.write_all(body)
}
