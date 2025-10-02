import { Component, inject, Input, OnInit } from '@angular/core';

import { WalletService } from 'src/app/solana/wallet.service';
import { SplitterListItemDto } from 'src/app/solsplits/models';

@Component({
  selector: 'app-vault',
  templateUrl: 'vault.component.html',
  styleUrl: 'vault.component.scss',
  imports: [  ]
})

export class VaultComponent implements OnInit {

  private ws  = inject(WalletService);

  @Input({required: true}) vault: SplitterListItemDto;
  
  constructor() { }

  ngOnInit() { }

  getMyShare() {
    const me = this.ws.publicKey()?.toBase58();
    const recepientMe = this.vault.recipients.find( r => r.address === me);
    return recepientMe ? recepientMe.percentage : 0;
  }

  getOwner(ownerId: String) {
    const me = this.ws.publicKey()?.toBase58();
    return ownerId === me ? 'Owner' : 'Participiant';
  }
}