package com.example.PawConnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class PawConnectApplication {

	public static void main(String[] args) {
		SpringApplication.run(PawConnectApplication.class, args);
	}

}
