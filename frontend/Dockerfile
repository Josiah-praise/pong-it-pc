FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json ./

RUN pnpm install

COPY public/ public/
COPY src/ src/

EXPOSE 3000

CMD ["pnpm", "start"] 