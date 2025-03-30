import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetFetchComponent } from './pet-fetch.component';

describe('PetFetchComponent', () => {
  let component: PetFetchComponent;
  let fixture: ComponentFixture<PetFetchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetFetchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PetFetchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
