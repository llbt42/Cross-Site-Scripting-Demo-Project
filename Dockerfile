FROM node:22-alpine

WORKDIR /app
COPY src ./src
RUN mkdir -p /app/data && chown -R node:node /app/data
ENV PORT=3000
ENV DATA_FILE=/app/data/comments.json
EXPOSE 3000

USER node
CMD ["node", "src/server.js"]
