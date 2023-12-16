FROM public.ecr.aws/docker/library/node:18-slim AS BUILD_IMAGE
LABEL authors="akmal0123"

WORKDIR /app

COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY src src/

SHELL ["/bin/bash", "-c"]
RUN npm install
RUN npm run build

FROM public.ecr.aws/docker/library/node:18-alpine
COPY --from=BUILD_IMAGE /app .

CMD ["npm", "sync"]