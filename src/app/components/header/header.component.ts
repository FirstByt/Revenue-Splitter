import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrl: 'header.component.scss',
  imports: [ RouterModule ] 
})

export class HeaderComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}