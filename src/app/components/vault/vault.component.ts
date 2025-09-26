import { Component, Input, OnInit } from '@angular/core';
import { Vault } from 'src/app/models/vault/vault';

@Component({
  selector: 'app-vault',
  templateUrl: 'vault.component.html',
  styleUrl: 'vault.component.scss'
})

export class VaultComponent implements OnInit {

  @Input({required: true}) vault: Vault;
  
  constructor() { }

  ngOnInit() { }
}