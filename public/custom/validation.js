// const form = document.getElementById("form");
// const username = document.getElementById("username");
// const email = document.getElementById("email");
// const password = document.getElementById("password");
// const password2 = document.getElementById("password2");
// const phone = document.getElementById("phone");
// form.addEventListener("submit", (e) => {
//   e.preventDefault();

//   validateInputs();
// });

// const setError = (element, message) => {
//   const inputControl = element.parentElement;
//   const errorDisplay = inputControl.querySelector(".error");

//   errorDisplay.innerText = message;
//   inputControl.classList.add("error");
//   inputControl.classList.remove("success");
// };

// const setSuccess = (element) => {
//   const inputControl = element.parentElement;
//   const errorDisplay = inputControl.querySelector(".error");

//   errorDisplay.innerText = "";
//   inputControl.classList.add("success");
//   inputControl.classList.remove("error");
// };

// const isValidEmail = (email) => {
//   const re =
//     /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//   return re.test(String(email).toLowerCase());
// };

// const validateInputs = () => {
//   const usernameValue = username.value.trim();
//   const emailValue = email.value.trim();
//   const passwordValue = password.value.trim();
//   const password2Value = password2.value.trim();
//   const phoneValue = phone.value.trim();

//   if (usernameValue === "") {
//     setError(username, "Username is required");
//   } else {
//     setSuccess(username);
//   }

//   if (emailValue === "") {
//     setError(email, "Email is required");
//   } else if (!isValidEmail(emailValue)) {
//     setError(email, "Provide a valid email address");
//   } else {
//     setSuccess(email);
//   }

//   if (phoneValue === "") {
//     setError(phone, "Mobile no is required");
//   } else if (phoneValue.length < 10) {
//     setError(phone, "Mobile number must be 10 digit");
//   } else if (phoneValue.length > 10) {
//     setError(phone, "Max 10 digits");
//   } else {
//     setSuccess(phone);
//   }

//   if (passwordValue === "") {
//     setError(password, "Password is required");
//   } else if (passwordValue.length < 6) {
//     setError(password, "Password must be at least 6 characters.");
//   } else {
//     setSuccess(password);
//   }

//   if (password2Value === "") {
//     setError(password2, "Please confirm your password");
//   } else if (password2Value !== passwordValue) {
//     setError(password2, "Passwords doesn't match");
//   } else {
//     setSuccess(password2);
//   }
// };

var firstNameError = document.getElementById("name-error");
var emailError = document.getElementById("email-error");
var passwordError = document.getElementById("password-error");
var submitError = document.getElementById("submit-error");
var phoneNumberError = document.getElementById("number-error");

function validateName() {
  var fname = document.getElementById("contact-name").value;

  if (fname.length == 0) {
    firstNameError.innerHTML = "Name required";
    return false;
  }
  if (!fname.match(/(^[a-zA-Z][a-zA-Z\s]{0,20}[a-zA-Z]$)/)) {
    firstNameError.innerHTML = "Invalid name";
    return false;
  } else {
    firstNameError.innerHTML = "";
    return true;
  }
}

function validateEmail() {
  var email = document.getElementById("contact-email").value;
  if (email.length == 0) {
    emailError.innerHTML = "Email required";
    return false;
  }
  if (
    !email.match(
      /^[a-zA-Z0-9.!#$%&’+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/
    )
  ) {
    emailError.innerHTML = "Email Invalid";
    return false;
  }
  emailError.innerHTML = "";
  return true;
}

function validatePassword() {
  var password = document.getElementById("contact-password").value;
  if (password.length == 0) {
    passwordError.innerHTML = "Password required";
    return false;
  }
  if (!password.match(/^\d{4}$/)) {
    passwordError.innerHTML = "password should contain atleast 4 characters";
    return false;
  }
  passwordError.innerHTML = "";
  return true;
}

function validateP() {
  var password = document.getElementById("contact-password").value;
  if (password.length == 0) {
    passwordError.innerHTML = "Password required";
    return false;
  }
  if (!password.match(/^\d{4}$/)) {
    passwordError.innerHTML = "Only 4 digits";
    return false;
  }
  passwordError.innerHTML = "";
  return true;
}

function validatePhoneNumber() {
  var phone = document.getElementById("contact-phonenumber").value;
  if (phone.length == 0) {
    phoneNumberError.innerHTML = "Phone Number required";
    return false;
  }
  if (phone.length < 10 || phone.length > 10) {
    phoneNumberError.innerHTML = "Invalid Mobile Number";
    return false;
  }

  phoneNumberError.innerHTML = "";
  return true;
}

function validateForm() {
  if (
    !validateName() ||
    !validateEmail() ||
    !validatePassword() ||
    validatePhoneNumber()
  ) {
    submitError.innerHTML = "Please fill the fields to submit";
    setTimeout(function () {
      submitError.style.display = "none";
    }, 4000);
    return false;
  }
}
