from app.deps import get_role_scope


def test_defaults_role_when_missing():
    scope = get_role_scope(x_role="area_director", x_scope_id=None)
    assert scope.role == "area_director"
    assert scope.scope_id is None


def test_invalid_role_falls_back_to_area_director():
    scope = get_role_scope(x_role="bogus", x_scope_id=None)
    assert scope.role == "area_director"


def test_pm_scope_with_id():
    scope = get_role_scope(x_role="pm", x_scope_id=42)
    assert scope.role == "pm"
    assert scope.scope_id == 42
