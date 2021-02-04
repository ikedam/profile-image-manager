import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppenderComponent } from './appender.component';

describe('AppenderComponent', () => {
  let component: AppenderComponent;
  let fixture: ComponentFixture<AppenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
