FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json ./

RUN pnpm install --prod

COPY . .

EXPOSE 5001

CMD ["node", "src/server.js"] 