# RateLimited URL Shortner

Typescript based express and react fullstack app for url shortner which implements ratelimitation during shortning and react dashboard for url shortned analytics.

## 2 core feature

- A custom ratelimiter for urlshortnign service using one of many rate limitation algorithm e.g:
  - Token bucket

  - Leaking bucket

  - Fixed window counter

  - Sliding window log

  - Sliding window counter

- A url-shortner that shortnes urls in to small alias that is later redirected to the original site

## Postgres docker image

`docker run --name my-postgres -e POSTGRES_PASSWORD=root -e POSTGRES_USER=root -e POSTGRES_DB=rlus -p 5432:5432 -v pgdata:/var/lib/postgresql/data -d postgres:16`

## Setting up url alias generation route /api/alias

### ToDo:

- [x] validation(added url validation for the user input url)
- [x] one of alias generation algorithm implementation
- [x] handle already generated url both alias and longUrl
- [] later i might consider another alias generation algorithm i.e Hash + collision resolution + bloom filter for exact non enumerable alias
- [] also i must not allow user to create short url of our domain is could lead to back and forth redirects

## Security concern to look at later

- [x] sql injection (auto handled by sequeliez ORM, [x] caution for raw query)
- cors as per assesment

## setting up url redirect route /api/:alias

### workings:

- Throw error when alias not found
- uses 302 as temporary redirect alter impt for analytics

## Click Analytics

- [x] a sucessufull click records user ip, timestamp at which click was registed and their IP address
- [x] identify the response structure for the chart
- [x] added get analtics route for specific and overall alias
- [x] validation for alias param

## rate limiter

- after understanding all the available rate limit strategery
- decided to go with the rate limit algorithm that assesment mentions
- I acknowledge the 2x max requests at the interval edges
- designed swapable stragey for later using other algorithms
- extensible with cache stategy with redis later to fight against slowness of disk access
- currently implemets store using java script Map

## frontend implementation

- setup vite, react typescript project
- using fetch api rather than any libary as it doesn't have large code base of tag and tag invalidation and config would just boiler plate than actual usuage
- add blocker for rate limitation
- researched grepsr brand and its implementation
