FROM debian:jessie

ENV LANG C.UTF-8
ENV PATH /opt/conda/bin:${PATH}
ENV PYTHON_RELEASE 3.4.3

ADD . /code/

WORKDIR /code/

RUN apt-get update

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  wget \
  git \
  bzip2
    
RUN wget -O /tmp/miniconda3.sh --quiet https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh \
    && /bin/bash /tmp/miniconda3.sh -b -p /opt/conda \
    && conda install python=$PYTHON_RELEASE \
    && conda remove -y pycrypto \
    && conda clean -y -i -l -t -p -s \
    && conda install -y pandas numpy numexpr Bottleneck \
    && rm -f /tmp/miniconda3.sh

RUN pip install python-decouple gunicorn aiohttp

RUN pip install -e .

#TODO: nvm version
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash

ENV NVM_DIR /root/.nvm

RUN ["/bin/bash", "-c", "source /root/.bashrc"] \
    && nvm install 5.0 \
    && npm install -g babel-cli \
    && npm install babel-preset-react \
    && babel --presets react src -d static

#TODO: purge nvm/node ?

RUN mkdir -vp /etc/gunicorn

ADD docker/gunicorn_conf.py /etc/gunicorn/conf.py

EXPOSE 8080

ENTRYPOINT ["gunicorn"]

CMD ["-c", "/etc/gunicorn/conf.py", "widukind_search_site:app"]

