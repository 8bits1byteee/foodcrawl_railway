# Use official PHP 8.2 Apache image
FROM php:8.2-apache

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    mysql-client \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    && docker-php-ext-enable pdo pdo_mysql mysqli

# Enable Apache mod_rewrite for URL rewriting
RUN a2enmod rewrite

# Copy Apache config
COPY .docker/apache.conf /etc/apache2/sites-available/000-default.conf

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

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start Apache in foreground
CMD ["apache2-foreground"]
