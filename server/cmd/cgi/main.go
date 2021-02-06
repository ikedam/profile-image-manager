package main

import (
	"net/http/cgi"
	"os"

	"github.com/ikedam/imageman/log"
	"github.com/ikedam/imageman/server"
)

var (
	version = "dev"
	commit  = "none"
)

func main() {
	config := &server.Config{
		ImageDir:      "./images",
		ImageBasePath: "../images",
	}
	s := server.NewServerForCGI(config)
	if err := cgi.Serve(s); err != nil {
		log.WithError(err).Errorf("Failed handling request")
		os.Exit(1)
	}
	os.Exit(0)
}
