FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY backend ./backend
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /bin/api ./backend/cmd/api

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 10001 app
WORKDIR /app

COPY --from=builder /bin/api /bin/api
COPY backend/migrations ./migrations
COPY backend/.env.example ./.env.example

RUN mkdir -p /app/uploads && chown -R app:app /app
USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["/bin/api"]
