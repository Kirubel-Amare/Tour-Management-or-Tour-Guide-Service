# Render Web Service: PHP 8.2 + Apache
FROM php:8.2-apache

# Install PostgreSQL PDO extension
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Copy application
WORKDIR /var/www/html
COPY . /var/www/html

# Apache listens on 8080 in Render; expose for clarity
EXPOSE 8080

# Render sets PORT; configure Apache to honor it
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Optional: enable mod_rewrite if needed later
RUN a2enmod rewrite
