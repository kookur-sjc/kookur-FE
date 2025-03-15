import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlappMemeGameComponent } from './flapp-meme-game.component';

describe('FlappMemeGameComponent', () => {
  let component: FlappMemeGameComponent;
  let fixture: ComponentFixture<FlappMemeGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlappMemeGameComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlappMemeGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
