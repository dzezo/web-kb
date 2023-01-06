FROM node:14-alpine

WORKDIR /usr/app
# Container created by this image has its own section on your hard drive that is completly isolted.
# That means that command npm install will not see package.json, even tho they are in the same folder currently.
# COPY command allows you to copy from "your machine" (path is relative to build context) into "container" (path is relative to WORKDIR)
COPY ./package.json ./
RUN npm install

# npm install is only concerned about changes in package.json thats why we are coping that one first.
# In case change happend in package.json file cached version will not be used. 
# Remember once there is a cache mismatch all following commands will get executed from scratch.
# Now we can alter our source code without re-installing our dependencies every time we re-build docker image. 
COPY ./ ./

CMD ["npm", "start"]