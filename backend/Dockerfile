FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json ./

RUN pnpm install

COPY . .

EXPOSE 8080

CMD ["pnpm", "start"] 