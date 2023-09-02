use crate::error::Error;
use dirs::config_dir;
use reqwest_dav::{Auth, ClientBuilder, Depth};
use std::io::Write;
use walkdir::WalkDir;
use zip::read::ZipArchive;
use zip::write::FileOptions;

#[tauri::command(async)]
pub async fn webdav(
    operate: &str,
    url: String,
    username: String,
    password: String,
    name: Option<String>,
) -> Result<String, Error> {
    // build a client
    let client = ClientBuilder::new()
        .set_host(url)
        .set_auth(Auth::Basic(username, password))
        .build()?;

    client.mkcol("/pot-app").await?;
    match operate {
        "list" => {
            let res = client.list("pot-app", Depth::Number(1)).await?;
            let result = serde_json::to_string(&res)?;
            Ok(result)
        }
        "get" => {
            let res = client.get(&format!("pot-app/{}", name.unwrap())).await?;
            let data = res.bytes().await?;
            let mut config_dir_path = config_dir().unwrap();
            config_dir_path = config_dir_path.join("com.pot-app.desktop");
            let zip_path = config_dir_path.join("archive.zip");

            let mut zip_file = std::fs::File::create(&zip_path)?;
            zip_file.write_all(&data)?;
            let mut zip_file = std::fs::File::open(&zip_path)?;
            let mut zip = ZipArchive::new(&mut zip_file)?;
            zip.extract(config_dir_path)?;
            Ok("".to_string())
        }
        "put" => {
            let mut config_dir_path = match config_dir() {
                Some(v) => v,
                None => {
                    return Err(Error::Error("WebDav Get Config Dir Error".into()));
                }
            };
            config_dir_path = config_dir_path.join("com.pot-app.desktop");
            let zip_path = config_dir_path.join("archive.zip");
            let config_path = config_dir_path.join("config.json");
            let plugin_path = config_dir_path.join("plugins");

            let zip_file = std::fs::File::create(&zip_path)?;
            let mut zip = zip::ZipWriter::new(zip_file);
            let options = FileOptions::default().compression_method(zip::CompressionMethod::Stored);
            zip.start_file("config.json", options)?;
            zip.write(&std::fs::read(&config_path)?)?;
            if plugin_path.exists() {
                for entry in WalkDir::new(plugin_path) {
                    let entry = entry?;
                    let path = entry.path();
                    let file_name = match path.strip_prefix(&config_dir_path)?.to_str() {
                        Some(v) => v,
                        None => return Err(Error::Error("WebDav Strip Prefix Error".into())),
                    };
                    if path.is_file() {
                        println!("adding file {path:?} as {file_name:?} ...");
                        zip.start_file(file_name, options)?;
                        zip.write(&std::fs::read(entry.path())?)?;
                    } else {
                        continue;
                    }
                }
            }

            zip.finish()?;
            match client
                .put(
                    &format!("pot-app/{}", name.unwrap()),
                    std::fs::read(&zip_path)?,
                )
                .await
            {
                Ok(()) => return Ok("".to_string()),
                Err(e) => {
                    return Err(Error::Error(format!("WebDav Put Error: {}", e).into()));
                }
            }
        }

        "delete" => match client.delete(&format!("pot-app/{}", name.unwrap())).await {
            Ok(()) => return Ok("".to_string()),
            Err(e) => {
                return Err(Error::Error(format!("WebDav Delete Error: {}", e).into()));
            }
        },
        _ => {
            return Err(Error::Error(
                format!("WebDav Operate Error: {}", operate).into(),
            ));
        }
    }
}
