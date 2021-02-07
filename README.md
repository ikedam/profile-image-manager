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

* Authentication

    * .htaccess

        ```
        AuthType Basic
        AuthName "Input your ID and Password."
        AuthUserFile /path/to/.htpasswd (Cannot be relative)
        require valid-user 
        ```

    * .htpasswd

        ```
        docker run --rm -it -v "$(pwd):/workspace" --entrypoint /bin/sh httpd:alpine -c "htpasswd -c /workspace/.htpasswd username"
        ```
