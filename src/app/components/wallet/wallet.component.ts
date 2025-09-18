import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-wallet',
  templateUrl: 'wallet.component.html',
  styleUrl: 'wallet.component.scss',
  imports: [CommonModule, ReactiveFormsModule],
})

export class WlletComponent implements OnInit {

  @Input({required: true}) name: string;
  @Input({required: true}) group!: FormGroup;

  @Output() removeRecipient = new EventEmitter<void>();

  constructor() { }

  ngOnInit() { }
}