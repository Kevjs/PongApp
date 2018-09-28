package com.codingdojo.pongapp.controllers;

import java.security.Principal;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.codingdojo.pongapp.models.Role;
import com.codingdojo.pongapp.models.User;
import com.codingdojo.pongapp.repositories.RoleRepository;
import com.codingdojo.pongapp.repositories.UserRepository;
import com.codingdojo.pongapp.services.UserService;
import com.codingdojo.pongapp.socketobjects.ClientKeyEventMessage;
import com.codingdojo.pongapp.validators.UserValidator;
import com.codingdojo.pongapp.socketobjects.PongGame;

@EnableScheduling
@Controller
public class PongAppController {
	@Autowired
	private UserService userService;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private UserValidator userValidator;
	@Autowired
    private SimpMessagingTemplate template;
	@Autowired
	private RoleRepository roleRepository;
	private PongGame pongGame = new PongGame();
	private final int tickRate = 10;


	@GetMapping("/login")
    public String login(Principal principal, @RequestParam(value="error", required=false) String error, @RequestParam(value="logout", required=false) String logout, Model model, @ModelAttribute User user) {
		if(roleRepository.findByName("ROLE_USER") == null) {
			roleRepository.save(new Role("ROLE_USER"));
		}
		if(roleRepository.findByName("ROLE_ADMIN") == null) {
			roleRepository.save(new Role("ROLE_ADMIN"));
		}
		if(principal != null) { return "redirect:/dashboard"; }
        if(error != null) {
            model.addAttribute("errorMessage", "Invalid Credentials, Please try again.");
        }
        if(logout != null) {
            model.addAttribute("logoutMessage", "Logout Successful!");
        }
        return "loginReg.jsp";
    }
	
	@PostMapping(value="/register", params = "register")
	public String register(@Valid @ModelAttribute User user, BindingResult result, HttpSession session, @RequestParam String register, @RequestParam("email") String email, @RequestParam("password") String password, HttpServletRequest request) {
		userValidator.validate(user, result);
		if(result.hasErrors()) {
			return "loginReg.jsp";
		} else {
			userService.saveUserWithRole(user);
			
			try {
				request.login(email, password);
			} catch (ServletException e) {
				System.out.println(e);
			}
			
			return "redirect:/dashboard";	
		}
	}
	
	@GetMapping("/")
	public String success() {
		return "redirect:/dashboard";
	}
	
	@GetMapping("/dashboard")
	public String dashboard() {
		return "dashboard.jsp";
	}
	
	@GetMapping("/game")
	public String game(Principal p) {
		pongGame.addUser(p.getName());
	    return "redirect:/game.html";
	}

	@MessageMapping("/myMovements")
	public void keyM(ClientKeyEventMessage message, Principal p) throws Exception{
		// System.out.println("From user "+p.getName());
	    pongGame.handleKeyEvent(message, p.getName());
	}

	@Scheduled(fixedRate = tickRate)
	public void serverTick(){
		this.template.convertAndSend("/topic/thisGame", pongGame.runGame(tickRate));
	}
}
