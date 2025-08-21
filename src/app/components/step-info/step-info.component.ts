import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-step-info',
  templateUrl: 'step-info.component.html',
  styleUrl: 'step-info.component.scss'
})

export class StepInfoComponent implements OnInit {

  @Input({required: true}) mainText: string;
  @Input() commentText: string;

  constructor() { }

  ngOnInit() { }
}