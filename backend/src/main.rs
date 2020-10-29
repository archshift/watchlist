use std::collections::HashMap;
use std::sync::Arc;

use serde::{Serialize, Deserialize};
use actix_web::{web, get, put, App, middleware, HttpServer};
use tokio::sync::RwLock;

type RatingMap = HashMap<String, i8>;

#[derive(Serialize, Deserialize, Default, Debug)]
struct Ratings {
    books: RatingMap,
    movies: RatingMap,
    tv: RatingMap,
}

type SyncRatings = Arc<RwLock<Ratings>>;

fn map_serde_err(s: serde_json::Error) -> std::io::Error {
    std::io::Error::new(
        std::io::ErrorKind::InvalidData,
        s.to_string())
}

#[get("/reviews.json")]
async fn get_reviews(data: web::Data<SyncRatings>) -> std::io::Result<String> {
    let data_read = data.read().await;
    serde_json::to_string(&*data_read)
        .map_err(map_serde_err)
}

#[put("/reviews.json")]
async fn add_review(data: web::Data<SyncRatings>, new_ratings: web::Json<Ratings>) -> std::io::Result<String> {
    let mut ratings_map = data.write().await;
    let insert_all = |dst: &mut RatingMap, src: &RatingMap| {
        src.iter()
        .for_each(|(book, rating)| {
            dst.insert(book.clone(), *rating);
        });
    };

    insert_all(&mut ratings_map.books, &new_ratings.books);
    insert_all(&mut ratings_map.movies, &new_ratings.movies);
    insert_all(&mut ratings_map.tv, &new_ratings.tv);

    serde_json::to_string(&*ratings_map)
        .map_err(map_serde_err)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let ratings = {
        let mut init_ratings = Ratings::default();
        init_ratings.books.insert("Lord of the Rings: Return of the King".into(), 5);
        init_ratings.books.insert("Lord of the Rings: The Two Towers".into(), 5);
        Arc::new(RwLock::new(init_ratings))
    };

    HttpServer::new(move || {
        App::new()
            .data(ratings.clone())
            .wrap(middleware::DefaultHeaders::new()
                .header("Access-Control-Allow-Origin", "*")
            )
            .service(get_reviews)
            .service(add_review)
        })
        .bind("127.0.0.1:8080")?
        .run()
        .await
}