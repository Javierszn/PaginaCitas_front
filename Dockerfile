# Etapa 1: Compilar Angular
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration production

# Etapa 2: Montarlo en NGINX
FROM nginx:alpine

# 1. Copiamos toda la carpeta del proyecto a NGINX
COPY --from=build /app/dist/citas-frontend /usr/share/nginx/html

# 2. El truco maestro: Si Angular escondió los archivos en la subcarpeta "browser", 
# los sacamos a la fuerza a la raíz. Si no lo hizo, el comando no hace nada y sigue adelante.
RUN mv /usr/share/nginx/html/browser/* /usr/share/nginx/html/ 2>/dev/null || true
RUN rm -rf /usr/share/nginx/html/browser 2>/dev/null || true

# 3. Configuración limpia de NGINX
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files \(uri\)uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80