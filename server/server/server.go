package server

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image/png"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/ikedam/imageman/log"
)

type Config struct {
	ImageDir         string
	ImageBasePath    string
	MaxDataSize      int
	MaxImages        int
	MaxDeletedImages int
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
	router.HandleFunc("", s.list).Methods("GET")
	router.HandleFunc("/", s.list).Methods("GET")
	router.HandleFunc("/upload/png", s.uploadPng).Methods("POST")
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

func (s *Server) getPathForFile(name string) string {
	return path.Clean(path.Join(
		s.prefix,
		s.config.ImageBasePath,
		name,
	))
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
				ID:        file.Name(),
				Image:     s.getPathForFile(file.Name()),
				CreatedAt: file.ModTime(),
			},
		)
	}
	sort.Slice(response, func(i, j int) bool {
		return response[i].CreatedAt.After(response[j].CreatedAt)
	})
	s.writeJSONResponse(w, response)
}

func (s *Server) countImages() (int, error) {
	files, err := ioutil.ReadDir(s.config.ImageDir)
	if err != nil {
		return 0, fmt.Errorf("Failed to list directory: %w", err)
	}
	cnt := 0
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if !isImageExt(file.Name()) {
			continue
		}
		cnt = cnt + 1
	}
	return cnt, nil
}

func (s *Server) prepareNewFile(ext string) string {
	for i := 0; i < 10; i++ {
		filename := fmt.Sprintf("%v%v", time.Now().UnixNano(), ext)
		path := filepath.Join(s.config.ImageDir, filename)
		if _, err := os.Stat(path); err == nil {
			//already exists
			continue
		} else if !os.IsNotExist(err) {
			log.WithError(err).
				WithField("filename", filename).
				Warning("Unexpected error to testing file exists")
			continue
		}
		return filename
	}
	return ""
}

func (s *Server) uploadPng(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil {
		log.WithField("path", r.RequestURI).
			Error("Body is nil")
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	body, err := ioutil.ReadAll(base64.NewDecoder(base64.StdEncoding, r.Body))
	if err != nil {
		log.WithError(err).
			WithField("path", r.RequestURI).
			Error("Failed to read body")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if s.config.MaxDataSize > 0 && len(body) > s.config.MaxDataSize {
		log.WithField("path", r.RequestURI).
			WithField("size", len(body)).
			Error("too large data")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if _, err := png.Decode(bytes.NewReader(body)); err != nil {
		log.WithError(err).
			WithField("path", r.RequestURI).
			Error("Failed to read body")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	cnt, err := s.countImages()
	if err != nil {
		log.WithError(err).
			WithField("path", r.RequestURI).
			Error("Failed to count images")
		w.WriteHeader(http.StatusRequestEntityTooLarge)
		return
	}

	if s.config.MaxImages > 0 && cnt > s.config.MaxImages {
		log.WithField("path", r.RequestURI).
			WithField("count", cnt).
			Error("too many images")
		w.WriteHeader(http.StatusTooManyRequests)
		return
	}

	filename := s.prepareNewFile(".png")
	if filename == "" {
		log.WithField("path", r.RequestURI).
			Error("Failed to issue a new filename")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	path := filepath.Join(s.config.ImageDir, filename)
	if err := ioutil.WriteFile(path, body, 0644); err != nil {
		log.WithError(err).
			WithField("path", r.RequestURI).
			WithField("filename", filename).
			Error("Failed to create a new image")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	stat, err := os.Stat(path)
	if err != nil {
		log.WithError(err).
			WithField("path", r.RequestURI).
			WithField("filename", filename).
			Error("Failed to stat the file")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	response := &profileImage{
		ID:        filename,
		Image:     s.getPathForFile(filename),
		CreatedAt: stat.ModTime(),
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
