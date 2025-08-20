import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from 'src/app/components/layout/header/header.component';

@Component({
  templateUrl: 'select-receipiants.page.html',
  styleUrl: 'select-receipiants.page.scss',
  imports: [ IonContent, HeaderComponent, RouterModule],
})

export class SelectReceipiantsPage implements OnInit {
  constructor() { }

  ngOnInit() { }
}