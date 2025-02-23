#!/bin/bash
if ! type psql >/dev/null 2>&1; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt-get update
    sudo apt-get -y install postgresql
    sudo apt -y install pgcli
fi

version=$(cd /etc/postgresql/ && ls)
conf=/etc/postgresql/$version/main/postgresql.conf
hba=/etc/postgresql/$version/main/pg_hba.conf
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$conf"
sudo echo "host    all             all             0.0.0.0/0               scram-sha-256" >>"$hba"
sudo systemctl restart postgresql
