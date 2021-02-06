package server

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/ikedam/imageman/log"
)

type Config struct {
	ImageDir      string
	ImageBasePath string
}

type Server struct {
	config  Config
	handler *mux.Router
	prefix  string
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.handler.ServeHTTP(w, r)
}

func NewServerForCGI(config *Config) *Server {
	return newServer(
		config,
		os.Getenv("SCRIPT_NAME"),
	)
}

func newServer(config *Config, prefix string) *Server {
	r := mux.NewRouter()
	s := &Server{
		config:  *config,
		handler: r,
		prefix:  prefix,
	}
	router := r.PathPrefix(prefix).Subrouter()
	router.HandleFunc("", s.list)
	router.HandleFunc("/", s.list)
	return s
}

type profileImage struct {
	ID        string    `json:"id"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"createdAt"`
}

var (
	imageFileExtList = []string{
		".jpg",
		".jpeg",
		".png",
	}
)

func isImageExt(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	for _, imageFileExt := range imageFileExtList {
		if ext == imageFileExt {
			return true
		}
	}
	return false
}

func (s *Server) list(w http.ResponseWriter, r *http.Request) {
	files, err := ioutil.ReadDir(s.config.ImageDir)
	if err != nil {
		log.WithError(err).
			WithField("path", r.RequestURI).
			WithField("dir", s.config.ImageDir).
			Error("Failed to list directory")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	response := []profileImage{}
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if !isImageExt(file.Name()) {
			continue
		}
		response = append(
			response,
			profileImage{
				ID: file.Name(),
				Image: path.Clean(path.Join(
					s.prefix,
					s.config.ImageBasePath,
					file.Name(),
				)),
				CreatedAt: file.ModTime(),
			},
		)
	}
	s.writeJSONResponse(w, response)
}

func (s *Server) writeJSONResponse(w http.ResponseWriter, obj interface{}) {
	body, err := json.Marshal(obj)
	if err != nil {
		log.WithError(err).
			WithField("content", obj).
			Error("Failed to serialize response")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Add("Content-Type", "application/json")
	w.Write(body)
}
