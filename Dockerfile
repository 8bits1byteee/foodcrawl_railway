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

# Enable Apache mod_rewrite and mod_env for environment variables
RUN a2enmod rewrite && a2enmod env

# Copy Apache config
COPY .docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Create entrypoint script to configure dynamic port
RUN echo '#!/bin/bash\nset -e\n\n# Use Railway PORT or default to 8080\nPORT=${PORT:-8080}\n\n# Update Apache port in configuration\nsed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/000-default.conf\nsed -i "s/Listen [0-9]*/Listen ${PORT}/" /etc/apache2/ports.conf 2>/dev/null || echo "Listen ${PORT}" >> /etc/apache2/ports.conf\n\necho "Starting Apache on port ${PORT}"\nexec apache2-foreground' > /entrypoint.sh && chmod +x /entrypoint.sh

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
