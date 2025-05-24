import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoodleComponent } from './doodle.component';

describe('DoodleComponent', () => {
  let component: DoodleComponent;
  let fixture: ComponentFixture<DoodleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoodleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DoodleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
