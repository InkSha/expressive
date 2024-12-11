create table if not exists test_1(
  id int primary key auto_increment,
  name varchar(255) default name
);

drop table if exists test_1;
