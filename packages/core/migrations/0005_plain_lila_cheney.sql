ALTER TABLE `user` ADD CONSTRAINT `user_stripe_customer_id_unique` UNIQUE(`stripe_customer_id`);
