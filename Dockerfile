FROM ubuntu:trusty

MAINTAINER <stephane.rault@radicalspam.org>

ENV PORT 8080
ENV WIDUKIND_MONGODB_URL mongodb://mongodb/widukind
ENV WIDUKIND_ES_URL http://es:9200

RUN \
  apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C3173AA6 C300EE8C 7F0CEB10 561F9B9CAC40B2F7 5862E31D && \
  apt-get update && \
  apt-get install -y --no-install-recommends apt-transport-https ca-certificates && \
  echo 'deb http://ppa.launchpad.net/nginx/stable/ubuntu trusty main' > /etc/apt/sources.list.d/nginx-stable-trusty.list && \
  apt-get -y update

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential \
  git \
  curl \
  language-pack-en \
  python3-dev \
  cython3 \
  nginx \
  python3-lxml \
  python3-pandas
  
ENV PATH /usr/local/bin:${PATH}
ENV LANG en_US.UTF-8

RUN pip3 install -U pip

ADD . /code/

WORKDIR /code/

RUN pip3 install https://github.com/Supervisor/supervisor/tarball/master

RUN pip3 install gunicorn

RUN pip3 install -e .

RUN mkdir -p /etc/supervisor/conf.d /var/log/supervisor
ADD docker/supervisord.conf /etc/supervisor/
RUN echo "alias ctl='/usr/local/bin/supervisorctl -c /etc/supervisor/supervisord.conf'" >> /root/.bashrc

RUN rm -f /etc/nginx/sites-enabled/* /etc/nginx/sites-available/*
RUN mkdir -vp /var/log/nginx && chown www-data /var/log/nginx
ADD docker/nginx.conf /etc/nginx/

ADD docker/start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

WORKDIR /var/log

EXPOSE 80

CMD ["/usr/local/bin/start.sh"]
