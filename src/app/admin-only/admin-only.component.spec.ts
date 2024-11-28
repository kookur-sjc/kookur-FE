import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOnlyComponent } from './admin-only.component';

describe('AdminOnlyComponent', () => {
  let component: AdminOnlyComponent;
  let fixture: ComponentFixture<AdminOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOnlyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
