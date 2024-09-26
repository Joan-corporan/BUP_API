FROM serviciosfinancieros.azurecr.io/node:14.15-buster-slim
WORKDIR /home/node/app
COPY . /home/node/app
RUN apt-get update && apt-get install -y openssl cl-base64
RUN npm config set @ssff:registry https://nexus.retailcard.cl/repository/npm-private/
RUN npm config set _auth $(echo -n "developer:D3v3l0p3r.$" | openssl base64)
RUN npm install
EXPOSE 8080
CMD node index.js