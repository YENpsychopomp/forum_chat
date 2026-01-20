--
-- PostgreSQL database cluster dump
--

\restrict s2xKaujOolvD5kca3YSMJuv99g3DP1GaFZWzKJXfnim9xW0U2wKrTigF14bonUS

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE chichi;
ALTER ROLE chichi WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:STdVjMP6+eOs4mlmj1BNMQ==$FRo7VCopH9rpm32bTwfPvSA1nADnOsH5eFLpoObd1qI=:aXIWYrgICkS96LBnfTV+QJZJOGrJEdYovslN1kJPftE=';

--
-- User Configurations
--








\unrestrict s2xKaujOolvD5kca3YSMJuv99g3DP1GaFZWzKJXfnim9xW0U2wKrTigF14bonUS

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict w1JEmjido6OsFREAox9qjERtfNNUvV6JjdeZrL2Ubuj4koylH9mHNAgvk26RMqe

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict w1JEmjido6OsFREAox9qjERtfNNUvV6JjdeZrL2Ubuj4koylH9mHNAgvk26RMqe

--
-- Database "chat_forum" dump
--

--
-- PostgreSQL database dump
--

\restrict WLkfJubi8RCfWdZaP1tRTRpIbVbaY5hhBzFrgKL8kP7RtrsNhg3U7AzxTmEDD8p

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: chat_forum; Type: DATABASE; Schema: -; Owner: chichi
--

CREATE DATABASE chat_forum WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE chat_forum OWNER TO chichi;

\unrestrict WLkfJubi8RCfWdZaP1tRTRpIbVbaY5hhBzFrgKL8kP7RtrsNhg3U7AzxTmEDD8p
\connect chat_forum
\restrict WLkfJubi8RCfWdZaP1tRTRpIbVbaY5hhBzFrgKL8kP7RtrsNhg3U7AzxTmEDD8p

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict WLkfJubi8RCfWdZaP1tRTRpIbVbaY5hhBzFrgKL8kP7RtrsNhg3U7AzxTmEDD8p

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict cmRPnhfbKOm5hcXx1CZbnOfTizdeIaSfTtXy9KQew5EBmxECm7dGMCwxPFZWwdR

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict cmRPnhfbKOm5hcXx1CZbnOfTizdeIaSfTtXy9KQew5EBmxECm7dGMCwxPFZWwdR

--
-- PostgreSQL database cluster dump complete
--

