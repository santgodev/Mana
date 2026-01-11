import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  demoUsers = [
    { role: 'admin', username: 'admin' },
    { role: 'manager', username: 'manager' },
    { role: 'employee', username: 'employee' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  isRegisterMode = false;

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;

      if (this.isRegisterMode) {
        this.authService.signUp(username, password).subscribe({
          next: (response: any) => {
            if (response.error) {
              this.snackBar.open('Error al registrarse: ' + response.error.message, 'Cerrar', { duration: 5000 });
            } else {
              this.snackBar.open('Registro exitoso. Por favor revisa tu correo o inicia sesión.', 'OK', { duration: 5000 });
              this.isRegisterMode = false; // Switch back to login
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error(err);
            this.snackBar.open('Error en el registro', 'Cerrar', { duration: 4000 });
          }
        });
      } else {
        this.authService.login({ username, password }).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.error) {
              this.snackBar.open('Error de login: ' + response.error.message, 'Cerrar', { duration: 5000 });
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            console.error('Error de login:', error);
            this.snackBar.open('Credenciales inválidas o error de conexión.', 'Cerrar', { duration: 4000 });
          }
        });
      }
    }
  }

  fillDemoCredentials(role: string): void {
    const user = this.demoUsers.find(u => u.role === role);
    if (user) {
      this.loginForm.patchValue({
        username: user.username,
        password: 'password'
      });
    }
  }
}