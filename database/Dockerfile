FROM mysql:8.4

ENV MYSQL_DATABASE=dormrepair

COPY conf/utf8mb4.cnf /etc/mysql/conf.d/utf8mb4.cnf
COPY init/ /docker-entrypoint-initdb.d/
