import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetFightComponent } from './pet-fight.component';

describe('PetFightComponent', () => {
  let component: PetFightComponent;
  let fixture: ComponentFixture<PetFightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetFightComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PetFightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
