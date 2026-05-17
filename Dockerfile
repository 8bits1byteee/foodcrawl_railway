# Use official PHP 8.2 Apache image
FROM php:8.2-apache

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    default-mysql-client \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    && docker-php-ext-enable pdo pdo_mysql mysqli

# Fix Apache MPM conflict - disable conflicting modules and keep only mpm_prefork
RUN a2dismod mpm_worker mpm_event 2>/dev/null || true && \
    rm -f /etc/apache2/mods-enabled/mpm_worker.* /etc/apache2/mods-enabled/mpm_event.* && \
    a2enmod mpm_prefork && \
    rm -f /etc/apache2/mods-enabled/mpm_prefork.* && \
    a2enmod mpm_prefork && \
    a2enmod rewrite && \
    a2enmod env

# Copy Apache config
COPY .docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Create entrypoint script to configure dynamic port
RUN echo '#!/bin/bash' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Use Railway PORT or default to 8080' >> /entrypoint.sh && \
    echo 'PORT=${PORT:-8080}' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Update Apache port configuration' >> /entrypoint.sh && \
    echo 'sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/000-default.conf' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Update ports.conf' >> /entrypoint.sh && \
    echo 'if grep -q "Listen" /etc/apache2/ports.conf 2>/dev/null; then' >> /entrypoint.sh && \
    echo '  sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '  echo "Listen ${PORT}" >> /etc/apache2/ports.conf' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo 'echo "Starting Apache on port ${PORT}"' >> /entrypoint.sh && \
    echo 'exec apache2-foreground' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Copy application files
COPY . /var/www/html/

# Create directories for uploads with proper permissions
RUN mkdir -p /var/www/html/images/attachments \
    && mkdir -p /var/www/html/images/restaurants \
    && chown -R www-data:www-data /var/www/html/images \
    && chmod -R 755 /var/www/html/images

# Set PHP configuration
RUN { \
        echo "upload_max_filesize = 100M"; \
        echo "post_max_size = 100M"; \
        echo "memory_limit = 256M"; \
        echo "max_execution_time = 60"; \
    } > /usr/local/etc/php/conf.d/uploads.ini

# Expose port (Railway will override this via PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/ || exit 1

# Start entrypoint script that configures dynamic port
ENTRYPOINT ["/entrypoint.sh"]
