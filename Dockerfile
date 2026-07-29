FROM ruby:3.3-bullseye

ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT=""

WORKDIR /srv/jekyll

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential git nodejs imagemagick \
  && rm -rf /var/lib/apt/lists/*

COPY Gemfile* ./

RUN gem install bundler -v 2.2.19 \
  && bundle install

COPY . .

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--no-watch"]
