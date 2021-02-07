# profile-image-manager


## Deploying to the server

* Build the angular files:

    ```
    cd client && docker-compose run --rm app npm run build -- --prod --output-hashing none
    ```

* Build the cgi file:

    ```
    cd server && docker-compose run --rm -e GOOS=freebsd -e GOARCH=amd64 dev go build -o api.cgi ./cmd/cgi
    ```
