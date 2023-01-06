# Use an existing docker image as a base
FROM alpine
# Why do we use alpine as base image?
# Well lets say that you have to install a google chrome on a machine that doesn't have an OS.
# First you would install OS before you attempt to download google chrome.
# alpine is in our case like an OS, it gives as a set of preinstalled programs that are useful.
# Effects of this image can be seen in the next line.

# Downloaad and install a dependency
RUN apk add --update redis
# apk has nothing to do with docker it stands for alpine package manager.

# Tell the image what to do when it starts as a container
CMD ["redis-server"]