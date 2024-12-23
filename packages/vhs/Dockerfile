FROM oven/bun:1.1.40 AS server

WORKDIR /app
RUN mkdir packages
COPY package.json ./
COPY packages/*/package.json ./packages/
COPY packages ./packages
COPY patches ./patches
RUN bun install
WORKDIR /app/packages/vhs
ENV NODE_ENV=production
RUN bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile server \
  ./src/index.ts

FROM golang:alpine AS terminal
WORKDIR /app
COPY packages/go/go.mod packages/go/go.sum ./
RUN cd packages/go && go mod download
COPY packages/go/. .
RUN cd packages/go && CGO_ENABLED=0 GOOS=linux go build -o terminal ./cmd/cli/main.go

FROM ghcr.io/charmbracelet/vhs
WORKDIR /app
COPY --from=terminal /app/terminal terminal
COPY --from=server /app/server server
ENV NODE_ENV=production

CMD ["./server"]
EXPOSE 3001
