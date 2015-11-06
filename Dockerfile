FROM python:3.4.3

MAINTAINER <stephane.rault@radicalspam.org>

ENV PORT 8080
ENV WIDUKIND_MONGODB_URL mongodb://mongodb/widukind
ENV WIDUKIND_ES_URL http://es:9200
ENV WIDUKIND_ES_INDEX widukind
ENV WIDUKIND_SECRET_KEY veryverysecretkeykeykey
ENV WIDUKIND_DEBUG false

RUN apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
RUN echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list

ENV NGINX_VERSION 1.9.6-1~jessie

RUN apt-get update
    
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  ca-certificates \
  nginx=${NGINX_VERSION}
  
ADD . /code/

WORKDIR /code/

RUN pip install https://github.com/Supervisor/supervisor/tarball/master

RUN pip install gunicorn

RUN pip install -e .

RUN mkdir -p /etc/supervisor/conf.d \
    && mkdir -p /var/log/supervisor \
    && rm -f /etc/nginx/sites-enabled/* \
    && rm -f /etc/nginx/sites-available/* \
    && mkdir -vp /var/log/nginx \
    && chown www-data /var/log/nginx

ADD docker/supervisord.conf /etc/supervisor/
ADD docker/nginx.conf /etc/nginx/
ADD docker/start.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/start.sh

EXPOSE 80

CMD ["/usr/local/bin/start.sh"]
