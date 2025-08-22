import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-wallet',
  templateUrl: 'wallet.component.html',
  styleUrl: 'wallet.component.scss'
})

export class WlletComponent implements OnInit {

  @Input({required: true}) name: string;

  constructor() { }

  ngOnInit() { }
}