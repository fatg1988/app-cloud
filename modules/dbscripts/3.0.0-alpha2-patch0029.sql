INSERT INTO AC_TRANSPORT (`id`, `name`, `port`, `protocol`, `service_prefix`, `description`) VALUES
-- (11, "http", 9091, "TCP", "bcu", "Ballerina composer UI"),
-- (12, "http", 8289, "TCP", "bcb", "Ballerina composer - backend http protocol"),
-- (13, "ws", 8290, "TCP", "bcw", "Ballerina composer - backend ws protocol"),
(15, "ws", 8291, "TCP", "bls", "Ballerina composer - lang server ws protocol");

INSERT INTO AC_RUNTIME_TRANSPORT (`transport_id`, `runtime_id`) VALUES
-- (9, 21),
-- (11, 21),
-- (12, 21),
-- (13, 21),
-- (14, 21);
(15, 21);